# ReactAndElixir

# Cleanup and Rebuild
```
docker-compose down
docker-compose build
docker-compose up
```

Deploy Fly.io Backend
```
 fly deploy --local-only --config backend/fly.toml // Make sure docker is installed on local
 ```

 Deploy Fly.io Frontend
```
 fly deploy --local-only // Make sure you are in Frontend/frontend folder
 ```