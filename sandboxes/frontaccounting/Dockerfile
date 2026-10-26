# FrontAccounting on PHP 8.2's built-in server: small, starts in a second, one process.
FROM alpine:3.20

RUN apk add --no-cache php82 php82-mysqli php82-session php82-gettext php82-mbstring php82-xml \
      php82-simplexml php82-calendar php82-iconv php82-ctype php82-openssl php82-fileinfo php82-gd php82-zlib \
 && adduser -D app && mkdir /app && chown app /app

COPY --chmod=755 start.sh /start.sh
USER app
EXPOSE 8080
ENTRYPOINT ["/start.sh"]
