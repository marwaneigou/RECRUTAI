@echo off
REM Stop all database containers

echo 🛑 Stopping all database containers...
echo =====================================

echo ℹ️  Stopping containers...
docker stop smart_recruit_postgres smart_recruit_pgadmin smart_recruit_mongodb smart_recruit_mongo_express smart_recruit_redis smart_recruit_redis_commander 2>nul

echo ℹ️  Removing containers...
docker rm smart_recruit_postgres smart_recruit_pgadmin smart_recruit_mongodb smart_recruit_mongo_express smart_recruit_redis smart_recruit_redis_commander 2>nul

echo ℹ️  Removing network...
docker network rm smart_recruit_network 2>nul

echo.
echo ✅ All database services stopped and removed!
echo.
echo 💡 To also remove data volumes (reset all data):
echo    docker volume prune
echo.
pause
