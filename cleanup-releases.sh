#!/usr/bin/env bash
# Чистка старих релізів Bookshelf на GitHub.
# Лишає: v1.4.0 (latest) та v1.0.6 (найстаріший).
# Видаляє релізи + теги: v1.3.0, v1.0.9, v1.0.8, v1.0.7 і висячий тег v1.0.5.
#
# Запуск:
#   export GH_TOKEN=твій_токен
#   bash cleanup-releases.sh

set -u
REPO="Yaposhich/bookshelf-app"
API="https://api.github.com/repos/$REPO"

if [ -z "${GH_TOKEN:-}" ]; then
  echo "❌ Не заданий GH_TOKEN. Спершу: export GH_TOKEN=твій_токен"
  exit 1
fi

AUTH=(-H "Authorization: token $GH_TOKEN" -H "Accept: application/vnd.github+json")

# Релізи, які треба видалити (реліз + однойменний тег)
RELEASES_TO_DELETE=("v1.3.0" "v1.0.9" "v1.0.8" "v1.0.7")
# Теги без релізу, які теж прибрати
EXTRA_TAGS_TO_DELETE=("v1.0.5")

for TAG in "${RELEASES_TO_DELETE[@]}"; do
  echo "→ $TAG: шукаю реліз..."
  ID=$(curl -s "${AUTH[@]}" "$API/releases/tags/$TAG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
  if [ -n "$ID" ]; then
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${AUTH[@]}" "$API/releases/$ID")
    echo "   реліз id=$ID видалено (HTTP $CODE)"
  else
    echo "   релізу не знайдено (можливо вже видалений)"
  fi
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${AUTH[@]}" "$API/git/refs/tags/$TAG")
  echo "   тег $TAG видалено (HTTP $CODE)"
done

for TAG in "${EXTRA_TAGS_TO_DELETE[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${AUTH[@]}" "$API/git/refs/tags/$TAG")
  echo "→ тег $TAG видалено (HTTP $CODE)"
done

echo ""
echo "✅ Готово. Лишились релізи:"
curl -s "$API/releases?per_page=100" | python3 -c "import sys,json; [print('   -', r['tag_name']) for r in json.load(sys.stdin)]" 2>/dev/null
