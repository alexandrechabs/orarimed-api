echo "** Creating default DB and users"

echo $POSTGRES_USER
psql -U $POSTGRES_USER -c "CREATE USER $DB_USER with encrypted password '$DB_PASSWORD';"
psql -U $POSTGRES_USER -c "CREATE DATABASE $DB_DATABASE;"
psql -U $POSTGRES_USER -c "GRANT ALL ON DATABASE $DB_DATABASE TO $DB_USER;"
psql -U $POSTGRES_USER -d $DB_DATABASE -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# Ajouter postgis dans la base concernée
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB_DATABASE" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS postgis;
EOSQL

echo "** Finished creating default DB and users"