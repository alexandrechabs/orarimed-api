#!/bin/bash
set -e

# Variables
TAG=${1:-latest}
ENV_FILE=".env.production"
DOCKER_COMPOSE="docker-compose -f docker-compose.prod.yml"

# Vérifier que le fichier .env.production existe
if [ ! -f "$ENV_FILE" ]; then
  echo "Erreur: Le fichier $ENV_FILE est introuvable"
  exit 1
fi

# Charger les variables d'environnement
export $(grep -v '^#' $ENV_FILE | xargs)

echo "🚀 Démarrage du déploiement de la version $TAG"

# Créer le réseau s'il n'existe pas
echo "🔧 Configuration du réseau Docker..."
docker network create orarimed-network 2>/dev/null || true

# Télécharger l'image
echo "📦 Téléchargement de l'image..."
docker pull ghcr.io/$(echo $GITHUB_REPOSITORY | tr '[:upper:]' '[:lower:]'):$TAG

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
$DOCKER_COMPOSE down --remove-orphans || true

# Démarrer les conteneurs
echo "🚀 Démarrage des conteneurs..."
TAG=$TAG $DOCKER_COMPOSE up -d

# Vérifier l'état des conteneurs
echo "🔍 Vérification de l'état des conteneurs..."
sleep 10  # Attendre que les conteneurs démarrent

# Vérifier que l'application est en bonne santé
HEALTH_CHECK_MAX_RETRIES=30
HEALTH_CHECK_INTERVAL=10
RETRY_COUNT=0

until [ $RETRY_COUNT -ge $HEALTH_CHECK_MAX_RETRIES ]
do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/health 2>/dev/null || true)
  
  if [ "$RESPONSE" = "200" ]; then
    echo "✅ L'application est en bonne santé"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "⏳ En attente du démarrage de l'application ($RETRY_COUNT/$HEALTH_CHECK_MAX_RETRIES)..."
  sleep $HEALTH_CHECK_INTERVAL
done

if [ $RETRY_COUNT -ge $HEALTH_CHECK_MAX_RETRIES ]; then
  echo "❌ L'application n'est pas en bonne santé après $HEALTH_CHECK_MAX_RETRIES tentatives"
  docker-compose logs app
  exit 1
fi

# Nettoyer les images non utilisées
echo "🧹 Nettoyage des images inutilisées..."
docker image prune -f

echo "✨ Déploiement réussi ! L'application est disponible sur http://localhost:3334"
