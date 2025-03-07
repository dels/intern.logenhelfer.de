require 'nokogiri'

raw_xml = File.read('contacts.xml')

def parse_xml(raw_xml)
  xml = Nokogiri::XML(raw_xml)
  count = 0
  xml.at("feed").search("entry").each do |child|
    next unless child
    next if child.blank?
    next unless child.at("id")
    puts "--"*60
#    puts "next child:"
#    puts child.element_children
    if child.css("title").first.content.eql?("System Group: My Contacts")
      puts "found Contacts id: #{child.css("id").first.content}"
    end
    if child.css("title").first.content.eql?("FWzE")
      puts "found FWzE id: #{child.css("id").first.content}"
    end
  end
end

def test_uniq
  arr = ["keks", "keks", "Keks", "KEKS", "asdf"]
  arr.uniq! {|elem| elem.upcase}

  puts arr


end

test_uniq
#parse_xml(raw_xml)
