#!/bin/sh
# Every start begins from the pristine source and the seeded demo database: down + up is a full reset.
set -eu

cp -R /src/. /app/
cp /app/config.default.php /app/config.php
# The sandbox is plain HTTP on 127.0.0.1; upstream only keeps sessions over HTTPS by default.
sed -i "s/define('SECURE_ONLY', true)/define('SECURE_ONLY', null)/" /app/includes/session.inc

# What the web installer would write.
cat > /app/config_db.php <<PHP
<?php
\$def_coy = 0;
\$tb_pref_counter = 1;
\$db_connections = array(0 => array(
  'name' => 'Training Co.', 'host' => 'db', 'port' => '', 'dbname' => 'frontaccounting',
  'collation' => 'utf8_xx', 'tbpref' => '0_', 'dbuser' => 'fa', 'dbpassword' => 'fa'));
PHP
cat > /app/lang/installed_languages.inc <<'PHP'
<?php
$installed_languages = array(0 => array('code' => 'C', 'name' => 'English', 'encoding' => 'iso-8859-1'));
$dflt_lang = 'C';
PHP
rm -rf /app/install

exec php82 -d log_errors=1 -d error_log=/dev/stderr -S 0.0.0.0:8080 -t /app
