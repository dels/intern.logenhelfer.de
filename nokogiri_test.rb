require 'nokogiri'


raw_xml = File.read('luther.xml')


def add_birthday(raw_xml)
  xml = Nokogiri::XML(raw_xml)
  puts xml
  xml.root << Nokogiri::XML::Node.new("gContact:birthday when='1943-12-12'", xml)
  puts "--"*30
  puts xml
end

add_birthday(raw_xml)

def extract_phone(child)
  res =""
  child.css("gd|phoneNumber").each do |phone|
    next unless phone['rel']
    ident = phone['rel'].match(/http\:\/\/schemas\.google\.com\/g\/2005#(.*)/)
    res << "#{ident.captures[0]} phone: #{phone.content}\n"
  end
  res
end

def parse_xml(raw_xml)
  xml = Nokogiri::XML(raw_xml)
  count = 0
  xml.at("feed").search("entry").each do |child|
    next unless child
    next if child.blank?
    next unless child.at("id")
    #  puts "next child:"
    #  puts child.element_children
    found_mail = false
    res = "\n\n"
    res << "id: #{child.at('id').content}\n"
    res << "title: #{child.at('title').content}\n"
    #  next unless child.at('title').content.eql?("Frederik Elsbroek")
    #  child.children.each {|c|
    #    puts c
    #  }
    #  puts child.namespaces
    child.css("gd|email").each do |mail|
      if mail['primary']
        res << "found primary email: #{mail['address']}\n"
      else
        res << "found email: #{mail['address']}\n"
      end
    end
    res << extract_phone(child)
    child.search("link[rel=\"edit\"]").each do |link|
    res << "found edit link: #{link['href']}\n"
    end
    puts res #if found_mail
  end
end
