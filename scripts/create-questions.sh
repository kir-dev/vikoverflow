for i in {1..500}
do
curl -s -w "${i}: %{time_total}s\n" --request POST 'http://localhost:3000/api/questions' \
--header 'Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMyMzBmNWUyLWM0MzctMWFlZC1kNzAzLTZlNWY3YWI4OWZkNCIsIm5hbWUiOiJWYXNzIEJlbmNlIiwiZW1haWwiOiJ2YmVuY3plMkBnbWFpbC5jb20iLCJpYXQiOjE1OTg0ODE2OTAsImV4cCI6MTU5OTA4NjQ5MH0.sEp9-V8gxph6fBfGVom4sJPiJ6hRwRoLR0Dnvloon9M;' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode "title=${i}" \
--data-urlencode "body=Lórum ipse: a kofikán hat a sekely cukarás bordék, fögség, csukalat. Jelenleg a nyugalék nem egyeli a lenevező kölcseni tornájának zúrlását, így jakodhatik + -1 böltség nylangás a szerülő holthoz képest. Ennek az a kavacsa, hogy a pájna nem pegelő más pánást a nyugalékhoz, vagy mert a nyugalékhoz nincsen döcögel az olgavas pánáson." \
--data-urlencode 'topic=vitmav42' \
--data-urlencode 'topicDescription=asdasdasd'
done
