#!/bin/bash
set -e

echo "** [$(date)] Début de l'initialisation des bases de données **"

# Fonction pour exécuter une commande avec log
exec_psql() {
    echo "[EXEC] $@"
    PGPASSWORD=$POSTGRES_PASSWORD psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c "$@"
}

# 1. Création des utilisateurs
echo "** Création des utilisateurs **"

# Fonction pour créer un utilisateur s'il n'existe pas
create_user_if_not_exists() {
    local user=$1
    local password=$2
    echo "  > Création de l'utilisateur $user"
    exec_psql "DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$user') THEN
            EXECUTE format('CREATE USER %I WITH ENCRYPTED PASSWORD %L', '$user', '$password');
            RAISE NOTICE 'Utilisateur % créé', '$user';
        ELSE
            RAISE NOTICE 'Utilisateur % existe déjà', '$user';
        END IF;
    END
    \$\$;"
}

# Créer chaque utilisateur
create_user_if_not_exists "$APP_USER" "$APP_PASSWORD"
create_user_if_not_exists "$SECURE_USER" "$SECURE_PASSWORD"
create_user_if_not_exists "$AUDIT_USER" "$AUDIT_PASSWORD"

# 2. Création des bases de données
echo "** Création des bases de données **"

# Fonction pour créer une base de données si elle n'existe pas
create_db_if_not_exists() {
    local db=$1
    local user=$2
    echo "  > Vérification de l'existence de la base de données $db"
    
    # Vérifier si la base de données existe déjà
    if ! PGPASSWORD=$POSTGRES_PASSWORD psql -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$db"; then
        echo "  >> Création de la base de données $db"
        exec_psql "CREATE DATABASE $db;"
    else
        echo "  >> La base de données $db existe déjà"
    fi
    
    # Donner les droits à l'utilisateur approprié
    if [ "$db" = "$APP_DB" ]; then
        echo "  >> Attribution des droits complets à $user sur $db"
        exec_psql "GRANT ALL PRIVILEGES ON DATABASE $db TO $user;"
    elif [ "$db" = "$SECURE_DB" ]; then
        echo "  >> Attribution des droits limités à $user sur $db"
        exec_psql "GRANT CONNECT, CREATE, TEMPORARY ON DATABASE $db TO $user;"
    else
        echo "  >> Attribution des droits de base à $user sur $db"
        exec_psql "GRANT CONNECT ON DATABASE $db TO $user;"
    fi
}

# Créer chaque base de données
echo "** Création des bases de données **"
create_db_if_not_exists "$APP_DB" "$APP_USER"
create_db_if_not_exists "$SECURE_DB" "$SECURE_USER"
create_db_if_not_exists "$AUDIT_DB" "$AUDIT_USER"

# 3. Configuration des droits
# Application DB - Droits complets
echo "** Configuration des droits pour $APP_USER sur $APP_DB **"
exec_psql "GRANT ALL PRIVILEGES ON DATABASE $APP_DB TO $APP_USER;"
PGPASSWORD=$POSTGRES_PASSWORD psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$APP_DB" -c "
    GRANT ALL ON SCHEMA public TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $APP_USER;
"

# Secure DB - Droits complets sauf DROP
echo "** Configuration des droits pour $SECURE_USER sur $SECURE_DB **"
exec_psql "GRANT CONNECT, CREATE, TEMPORARY ON DATABASE $SECURE_DB TO $SECURE_USER;"
PGPASSWORD=$POSTGRES_PASSWORD psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$SECURE_DB" -c "
    GRANT USAGE, CREATE ON SCHEMA public TO $SECURE_USER;
    GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES ON ALL TABLES IN SCHEMA public TO $SECURE_USER;
    GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO $SECURE_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES ON TABLES TO $SECURE_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO $SECURE_USER;
"

# Audit DB - Lecture/Écriture seule, pas de modifications de structure
echo "** Configuration des droits pour $AUDIT_USER sur $AUDIT_DB **"
exec_psql "GRANT CONNECT ON DATABASE $AUDIT_DB TO $AUDIT_USER;"
PGPASSWORD=$POSTGRES_PASSWORD psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$AUDIT_DB" -c "
    GRANT CREATE, USAGE ON SCHEMA public TO $AUDIT_USER;
    GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO $AUDIT_USER;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $AUDIT_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT ON TABLES TO $AUDIT_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO $AUDIT_USER;
"

# 4. Activation de PostGIS sur les trois bases
for db in "$APP_DB" "$SECURE_DB" "$AUDIT_DB"; do
    echo "** Activation de PostGIS sur $db **"
    PGPASSWORD=$POSTGRES_PASSWORD psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" -c "
        CREATE EXTENSION IF NOT EXISTS postgis;
        SELECT PostGIS_version();
    "
done

echo "** [$(date)] Initialisation terminée avec succès **"
echo "** Bases de données configurées :"
echo "  - $APP_DB : utilisateur $APP_USER (droits complets)"
echo "  - $SECURE_DB : utilisateur $SECURE_USER (pas de DROP/TRUNCATE)"
echo "  - $AUDIT_DB : utilisateur $AUDIT_USER (lecture/écriture uniquement)"