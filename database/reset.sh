#!/bin/bash

# Script para resetar o banco de dados CheckAgora
# Uso: ./reset.sh [usuario] [senha]

echo "========================================="
echo "  CheckAgora - Reset de Banco de Dados"
echo "========================================="
echo ""

# Parâmetros
DB_USER=${1:-root}
DB_PASS=$2

# Verificar se a senha foi fornecida
if [ -z "$DB_PASS" ]; then
    echo "Executando MySQL (será solicitada a senha)..."
    mysql -u $DB_USER -p < reset_database.sql
else
    echo "Executando MySQL com senha fornecida..."
    mysql -u $DB_USER -p$DB_PASS < reset_database.sql
fi

# Verificar se foi bem-sucedido
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Banco de dados resetado com sucesso!"
    echo ""
    echo "📋 Informações importantes:"
    echo "   - Banco: checkagora_db"
    echo "   - 8 UBS criadas"
    echo "   - 8 médicos criados"
    echo "   - Senha padrão dos médicos: senha123"
    echo "   - Código de registro: ALIVIX"
    echo ""
    echo "🔑 Credenciais de teste:"
    echo "   CRM: 12345 | Email: carlos.silva@checkagora.com"
    echo "   CRM: 12346 | Email: maria.santos@checkagora.com"
    echo ""
else
    echo ""
    echo "❌ Erro ao resetar o banco de dados!"
    echo "   Verifique se o MySQL está rodando e as credenciais estão corretas."
    echo ""
fi
