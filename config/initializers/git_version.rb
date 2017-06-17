APP_VERSION = {
  :major => 0,
  :minor => 4,
  :patch => `git log -n1 --date=short --pretty=format:"%h"`.chomp,
  :last_commit_at => `git log -n1 --date=short --pretty=format:"%ad"`.chomp,
  :deployed_at => Time.now.strftime("%d.%m.%Y")
}.freeze

APP_VERSION_STRING = [APP_VERSION[:major], APP_VERSION[:minor], APP_VERSION[:patch]].join('.').freeze

