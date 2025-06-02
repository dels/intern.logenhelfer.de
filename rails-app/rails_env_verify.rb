#!/usr/bin/env ruby

def gem_version(name)
  info = `bundle info #{name} 2>&1`
  if info =~ /Could not find/
    "NOT FOUND"
  elsif info =~ /Summary:.+\(([\d\.]+)\)/m
    $1
  elsif info =~ /#{name} \(([\d\.]+)\)/
    $1
  elsif info =~ /version (\d[\d\.]*)/
    $1
  else
    # fallback: try Gemfile.lock
    lock = File.read("Gemfile.lock") rescue ""
    m = lock.match(/^\s*#{name} \(([\d\.]+)\)/)
    m ? m[1] : "NOT FOUND"
  end
end

puts "\n== Rails 5.2 + Sprockets environment check =="

gems = {
  'rails'           => '5.2.8.1',
  'rack'            => '2.2.16',
  'sprockets'       => '3.7.5',
  'sprockets-rails' => '3.4.2',
  'sass-rails'      => '5.1.0'
}

errors = []

gems.each do |name, expected|
  found = gem_version(name)
  print "#{name.ljust(18)} expected: #{expected.ljust(8)} found: #{found}"
  if found != expected
    puts "   [!!]"
    errors << "#{name}: expected #{expected}, found #{found}"
  else
    puts "   [OK]"
  end
end

puts "\nChecking config.load_defaults in config/application.rb..."
app_rb = File.read('config/application.rb')
unless app_rb =~ /config\.load_defaults\s+5\.2/
  errors << "config.load_defaults is not 5.2! (set to #{app_rb[/config\.load_defaults\s+([\d.]+)/, 1] || "NOT SET"})"
end

puts "Checking for manual ActionDispatch::Static usage..."
# Only scan Ruby config files, not current dir
static_refs = `grep -r --include=*.rb 'ActionDispatch::Static' config/`.strip
if static_refs != ""
  errors << "Manual ActionDispatch::Static found in config:\n#{static_refs}\nRemove any 'use ActionDispatch::Static'."
end

puts "Checking for running Spring/Zeus..."
if `ps aux | grep spring | grep -v grep`.strip != "" || `ps aux | grep zeus | grep -v grep`.strip != ""
  errors << "Spring or Zeus processes running! Stop with: pkill -f spring && pkill -f zeus"
end

puts "\nSUMMARY:"
if errors.empty?
  puts "✅ All checks passed. Your Rails asset pipeline setup looks correct!"
else
  puts "❌ Issues found:"
  errors.each_with_index { |err, i| puts "  [#{i+1}] #{err}" }
end
