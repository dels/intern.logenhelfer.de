# APP_VERSION = {
#   :major => 0,
#   :minor => 9,
#   :patch => `git log -n1 --date=short --pretty=format:"%h"`.chomp,
#   :hash =>  `git log -n1 --date=short --pretty=format:"%H"`.chomp,
#   :last_commit_at => `git log -n1 --date=short --pretty=format:"%ci"`.chomp,
#   :deployed_at => Time.now.strftime("%d.%m.%Y"),
#   :deployed_at_full => Time.now
# }.freeze

# if APP_VERSION.nil? || APP_VERSION.empty?
#   APP_VERSION_STRING = '0.9.6'.freeze
# else
#   APP_VERSION_STRING = [APP_VERSION[:major], APP_VERSION[:minor], APP_VERSION[:patch]].join('.').freeze
# end

APP_VERSION = {
  :major => 0,
  :minor => 9,
  :patch => 10,
  :hash =>  "no-hash".freeze,
  :last_commit_at => Time.now.strftime("%d.%m.%Y"),
  :deployed_at => Time.now.strftime("%d.%m.%Y"),
  :deployed_at_full => Time.now
}.freeze

APP_VERSION_STRING = '0.9.10'.freeze