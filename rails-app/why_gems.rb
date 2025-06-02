require 'bundler'
specs = Bundler.load.specs

puts "\nDEPENDENCY TREE FOR RACK/Sprockets:\n"
%w[rack sprockets sprockets-rails sass-rails].each do |gem|
  spec = specs.find { |s| s.name == gem }
  next unless spec

  puts "\n--- #{gem} (#{spec.version}) ---"
  dependents = specs.select { |s| s.dependencies.any? { |d| d.name == gem } }
  if dependents.empty?
    puts "No gems depend on #{gem}"
  else
    dependents.each do |d|
      puts "Required by: #{d.name} (#{d.version})"
    end
  end
end
