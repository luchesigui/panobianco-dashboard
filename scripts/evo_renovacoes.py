#!/usr/bin/env python3
"""
Panobianco / EVO - Relatorio de Renovacoes e Pendencias
Cruza dados de membros, contratos e contas a receber da API eve.

Uso:
    python3 evo_renovacoes_pendencias.py [--dias 5] [--membros 500] [--json|--csv]

Requer: requests (pip install requests)
"""

import json
import csv
import sys
import argparse
import requests
from datetime import datetime, timedelta
import base64

# ============================================================
# Configuracao
# ============================================================
BASE_URL = "https://evo-integracao-api.w12app.com.br"
AUTH = "Basic " + base64.b64encode(
    b"panobiancos:BE64718A-E711-4749-865A-BB6A0AD621E5"
).decode()
HEADERS = {"Authorization": AUTH}

# Filtros de status considerados como "pendencia"
PENDING_STATUSES = {"Expired", "Pending", "pending", "Inadimplente"}
PAID_STATUSES = {"Canceled", "Paid", "received", "Baixado"}


# ============================================================
# Funcoes de API
# ============================================================
def api_get(endpoint, params=None, skip=0, take=50):
    """Faz GET na API com parametros base."""
    url = f"{BASE_URL}{endpoint}"
    base_params = {"take": take, "skip": skip}
    if params:
        base_params.update(params)
    resp = requests.get(url, headers=HEADERS, params=base_params, timeout=60)
    resp.raise_for_status()
    return resp


def get_members_sample(limit=None):
    """Busca membros com paginacao. Deixa limit=None para buscar todos."""
    members = []
    skip = 0
    take = 50
    total = None
    while True:
        resp = api_get("/api/v1/members", skip=skip, take=take)
        if total is None:
            total = int(resp.headers.get("total", 0))
        data = resp.json()
        if not data:
            break
        members.extend(data)
        n = len(members)
        pct = (n / total * 100) if total else 0
        print(
            f"  Membros: {n}/{total} ({pct:.0f}%)\r",
            end="",
            file=sys.stderr,
        )
        skip += take
        if limit and n >= limit:
            break
        if n >= total or len(data) < take:
            break
    print(f"\n  Total carregado: {len(members)} membros", file=sys.stderr)
    return members, total


def get_receivables_for_member(id_member):
    """Busca recebiveis de um membro."""
    resp = api_get("/api/v1/receivables", params={"idSale": 0, "idMember": id_member})
    return resp.json()


# ============================================================
# Analise de renovacao
# ============================================================
def get_latest_contract(memberships):
    """Retorna o contrato mais recente com endDate valido."""
    valid = [m for m in memberships if m.get("endDate")]
    if not valid:
        return None
    return max(valid, key=lambda x: x["endDate"])


def analyze_renovations(members, days_before=5, lookback_days=30):
    """
    Analisa membros ativos com contratos proximos do vencimento.
    Retorna lista de dicts com info de renovacao.
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    target = today + timedelta(days=days_before)
    lookback = today - timedelta(days=lookback_days)

    renewals = []
    for member in members:
        status = member.get("status", "")
        if status != "Active":
            continue

        ms = member.get("memberships", [])
        if not ms:
            continue

        latest = get_latest_contract(ms)
        if not latest:
            continue

        end_date = datetime.strptime(latest["endDate"], "%Y-%m-%dT%H:%M:%S")
        days_until = (end_date - today).days

        # Inclui membros com contrato ativo/expired que vencem ate N dias
        # ou que venceram ha ate X dias atras (para ofertar reconquista)
        contract_status = latest.get("membershipStatus", "")
        if contract_status not in ("active", "expired"):
            continue
        if days_until > days_before:
            continue
        if days_until < -lookback_days:
            continue

        # Extrai contatos
        phone, email = "", ""
        for c in member.get("contacts", []):
            ct = c.get("contactType")
            if ct == "Cellphone":
                phone = c.get("description", "")
            elif ct == "E-mail":
                email = c.get("description", "")

        renewals.append(
            {
                "id_member": member.get("idMember"),
                "nome": f"{member.get('firstName', '')} {member.get('lastName', '')}".strip(),
                "filial": member.get("branchName", ""),
                "plano": latest.get("name", "").strip(),
                "inicio_contrato": latest.get("startDate", "")[:10],
                "fim_contrato": end_date.strftime("%d/%m/%Y"),
                "fim_contrato_iso": latest["endDate"][:10],
                "dias_ate_vencimento": days_until,
                "status_membro": status,
                "status_contrato": contract_status,
                "telefone": phone,
                "email": email,
                "id_contrato": latest.get("idMemberMembership"),
            }
        )

    renewals.sort(key=lambda x: x["dias_ate_vencimento"])
    return renewals


# ============================================================
# Cruzamento com pendencias
# ============================================================
def check_pending_fees(renewals):
    """Verifica pendencias financeiras para cada aluno da lista."""
    print(f"\n  Verificando pendencias para {len(renewals)} alunos...", file=sys.stderr)

    for i, r in enumerate(renewals):
        id_mem = r["id_member"]
        try:
            receivables = get_receivables_for_member(id_mem)
        except Exception as e:
            print(f"    [!] Erro ao buscar pendencias do membro {id_mem}: {e}", file=sys.stderr)
            receivables = []

        pending = [
            rec
            for rec in receivables
            if isinstance(rec.get("status"), dict)
            and rec["status"].get("name") in PENDING_STATUSES
        ]

        total_pending = sum(rec.get("ammount", 0) or 0 for rec in pending)
        oldest_due = None
        if pending:
            dues = [
                datetime.strptime(rec["dueDate"][:10], "%Y-%m-%d")
                for rec in pending
                if rec.get("dueDate")
            ]
            if dues:
                oldest_due = min(dues).strftime("%d/%m/%Y")

        r["tem_pendencia"] = len(pending) > 0
        r["qtd_pendencias"] = len(pending)
        r["valor_total_pendente"] = round(total_pending, 2) if total_pending else 0
        r["vencimento_mais_antigo"] = oldest_due or "-"

        pct = ((i + 1) / len(renewals) * 100)
        print(
            f"    Pendencias: {i+1}/{len(renewals)} ({pct:.0f}%)\r",
            end="",
            file=sys.stderr,
        )

    print(f"\n    Concluido!", file=sys.stderr)
    return renewals


# ============================================================
# Formatacao de saida
# ============================================================
def format_days_text(days):
    if days < 0:
        return f"VENCIDO ha {abs(dias)} dia(s)"
    if days == 0:
        return "VENCE HOJE"
    return f"Vence em {days} dia(s)"


def print_report(data, days):
    """Imprime relatorio no console."""
    hoje = datetime.now().strftime("%d/%m/%Y %H:%M")

    print("\n" + "=" * 72)
    print(f"  PANOBIANCO ACADEMIA - RELATORIO DE RENOVACOES E PENDENCIAS")
    print(f"  Gerado em: {hoje} | Janela de renovacao: {days} dias")
    print("=" * 72)

    # Resumo
    total = len(data)
    com_pend = sum(1 for d in data if d.get("tem_pendencia"))
    vencem_hoje = sum(1 for d in data if d["dias_ate_vencimento"] == 0)
    vencem_em_1_5 = sum(1 for d in data if 0 < d["dias_ate_vencimento"] <= 5)
    vencidos_recentes = sum(1 for d in data if -30 <= d["dias_ate_vencimento"] < 0)

    print("\n  RESUMO")
    print("  " + ("-" * 40))
    print(f"  Total de alunos na lista:         {total}")
    print(f"  Vencem em 1-5 dias:               {vencem_em_1_5}")
    print(f"  Vencem hoje:                      {vencem_hoje}")
    print(f"  Vencidos ha ate 30 dias:          {vencidos_recentes}")
    print(f"  Com pendencia financeira:         {com_pend}")

    # Tabela renovacoes
    print(f"\n\n  PROXIMAS RENOVACOES")
    print(f"  {'-' * 72}")
    print(
        f"  {'Nome':<28} {'Vencimento':>11} {'Dias':>5} {'Plano':<22} {'Pend.':>5}"
    )
    print(f"  {'-' * 28} {'-' * 11} {'-' * 5} {'-' * 22} {'-' * 5}")

    for d in data[:50]:
        name = d["nome"][:26]
        mark = "SIM" if d.get("tem_pendencia") else "nao"
        plano = d["plano"][:20]
        print(
            f"  {name:<28} {d['fim_contrato']:>11} {d['dias_ate_vencimento']:>5} {plano:<22} {mark:>5}"
        )

    if len(data) > 50:
        print(f"  ... e mais {len(data) - 50} alunos.")

    # Detalhe de quem tem pendencia
    if com_pend:
        print(f"\n\n  ALUNOS COM PENDENCIA FINANCEIRA")
        print(f"  {'-' * 72}")
        for d in data:
            if d.get("tem_pendencia"):
                print(f"  * {d['nome']}")
                print(
                    f"    Vence: {d['fim_contrato']} | Pendencias: {d['qtd_pendencias']}",
                    end="",
                )
                print(f" | Valor em aberto: R$ {d['valor_total_pendente']:.2f}")
                print(
                    f"    Tel: {d['telefone'] or '-'} | Email: {d['email'] or '-'}"
                )


# ============================================================
# Exportacao
# ============================================================
def export_json(data, filename):
    out = {
        "data_geracao": datetime.now().isoformat(),
        "total_alunos": len(data),
        "alunos": data,
    }
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\n  JSON salvo: {filename}", file=sys.stderr)


def export_csv(data, filename):
    if not data:
        return
    cols = [
        "nome",
        "filial",
        "plano",
        "fim_contrato",
        "dias_ate_vencimento",
        "telefone",
        "email",
        "tem_pendencia",
        "qtd_pendencias",
        "valor_total_pendente",
        "vencimento_mais_antigo",
    ]
    with open(filename, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(data)
    print(f"  CSV salvo: {filename}", file=sys.stderr)


# ============================================================
# Main
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description="Panobianco - Relatorio de renovacoes e pendencias"
    )
    parser.add_argument("--dias", type=int, default=5, help="Dias ate vencimento (padrao: 5)")

    parser.add_argument(
        "--membros",
        type=int,
        default=None,
        help="Limite de membros a analisar (padrao: todos)",
    )
    parser.add_argument("--sem-pendencia", action="store_true", help="Nao consulta pendencias (mais rapido)")
    parser.add_argument("--json", action="store_true", help="Exportar JSON")
    parser.add_argument("--csv", action="store_true", help="Exportar CSV")
    args = parser.parse_args()

    print(
        f"\n[1/3] Buscando membros na API EVO (limite: {args.membros or 'todos'})..."
    )
    members, total = get_members_sample(limit=args.membros)

    print(f"\n[2/3] Analisando contratos com renovacao em {args.dias} dias...")
    renewals = analyze_renovations(members, days_before=args.dias)
    print(f"  Alunos ativos com renovacao no periodo: {len(renewals)}")

    if not args.sem_pendencia and renewals:
        print(f"\n[3/3] Cruzando com pendencias financeiras...")
        renewals = check_pending_fees(renewals)
    else:
        # Marca todos como sem info de pendencia se nao consultamos
        for r in renewals:
            r.setdefault("tem_pendencia", None)
            r.setdefault("qtd_pendencias", 0)
            r.setdefault("valor_total_pendente", 0)

    print_report(renewals, args.dias)

    # Exportar se solicitado
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    if args.json:
        export_json(renewals, f"evo_renovacoes_{ts}.json")
    if args.csv:
        export_csv(renewals, f"evo_renovacoes_{ts}.csv")

    # Sempre salva JSON como registro
    if not args.json:
        export_json(renewals, f"evo_renovacoes_{ts}.json")


if __name__ == "__main__":
    main()
