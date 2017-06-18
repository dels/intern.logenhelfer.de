# TODO - add other addresses
#      - parse_xml

# TODO - deal with fax for home, work, and other
# TODO - parse addresses from xml
# TODO - ensure group membership
# TODO - addresses should also be valid if they have a filled postAddress field not only if they have street, postcode, and city
class GoogleContact

  attr_accessor :firstname, :lastname, :name, :home_email, :work_email, :mobile_phone, :home_phone,
                :work_phone, :home_fax, :work_fax, :home_address, :business_address, :date_of_birth, :priv_addr, :business_addr,
                :street, :postcode, :city, :home_address, :work_address, :other_address, :groups, :system_groups,
                :edit_href, :my_json, :my_xml, :edit_url, :self_url
  
  def initialize()
    @home_email = []
    @work_email = []
    @mobile_phone = []
    @home_phone = []
    @work_phone = []
    @home_address = {}
    @work_address = {}
    @other_address = []
    @groups = []
    @system_groups = []
  end

  
  def to_atom
    res = ""
    # xmlns:batch='http://schemas.google.com/gdata/batch'
    res << "<atom:entry xmlns:atom='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005' xmlns:gContact='http://schemas.google.com/contact/2008'>\n"
    res << "  <atom:category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/contact/2008#contact'/>\n"
    res << "  <title>#{@firstname} #{@lastname}</title>"
    res << "  <gd:name>\n"
    res << "    <gd:givenName>#{firstname}</gd:givenName>\n"
    res << "    <gd:familyName>#{@lastname}</gd:familyName>\n"
    res << "    <gd:fullName>#{@firstname} #{@lastname}</gd:fullName>\n"
    res << "  </gd:name>\n"
    
    res << "  <atom:content type=\"text\">Notes</atom:content>\n"
    # walk through all home
    @home_email.each do |m|
      #  primary='true'
      next if m.strip.empty?
      res << "  <gd:email rel='http://schemas.google.com/g/2005#home' address='#{m}'/>\n"
    end
    @home_phone.each do |p|
      next if p.strip.empty?
      res << "  <gd:phoneNumber rel='http://schemas.google.com/g/2005#home'>#{p}</gd:phoneNumber>\n"
    end
    
    # walk through work
    @work_email.each do |m|
      next if m.strip.empty?
      #  primary='true'
      res << "  <gd:email rel='http://schemas.google.com/g/2005#work' address='#{m}'/>\n"
    end
    @work_phone.each do |p|
      next if p.strip.empty?
      res << "  <gd:phoneNumber rel='http://schemas.google.com/g/2005#work'>#{p}</gd:phoneNumber>\n"
    end
    # mobile phone
    @mobile_phone.each do |p|
      # primary='true'
      next if p.strip.empty?
      res << "  <gd:phoneNumber rel='http://schemas.google.com/g/2005#mobile'>#{p}</gd:phoneNumber>\n"
    end
    @home_address.delete_if {|key,val| val.nil? || val.strip.empty?}
    @work_address.delete_if {|key,val| val.nil? || val.strip.empty?}
    # TODO @other_address.delete_if {|elem| elem.nil? || elem.strip.empty?}
    unless @home_address.empty?
      res << "  <gd:structuredPostalAddress rel=\"http://schemas.google.com/g/2005#home\">\n"
      res << "    <gd:street>#{@home_address[:street]}</gd:street>\n"
      res << "    <gd:postcode>#{@home_address[:postcode]}</gd:postcode>\n"
      res << "    <gd:city>#{@home_address[:city]}</gd:city>\n"
      res << "    <gd:formattedAddress>#{@home_address[:street]}\n#{@home_address[:postcode]} #{@home_address[:city]}</gd:formattedAddress>\n"
      res << "  </gd:structuredPostalAddress>\n"
    end
    unless @work_address.empty?
      res << "  <gd:structuredPostalAddress rel=\"http://schemas.google.com/g/2005#work\">\n"
      res << "    <gd:street>#{@work_address[:street]}</gd:street>\n"
      res << "    <gd:postcode>#{@work_address[:postcode]}</gd:postcode>\n"
      res << "    <gd:city>#{@work_address[:city]}</gd:city>\n"
      res << "    <gd:formattedAddress>#{@work_address[:street]}\n#{@work_address[:postcode]} #{@work_address[:city]}</gd:formattedAddress>\n"
      res << "  </gd:structuredPostalAddress>\n"
    end
    @other_address.each do |other|
      next if other.empty?
     res << "  <gd:structuredPostalAddress label=\"#{other[:label]}\">\n"
     res << "    <gd:street>#{other[:street]}</gd:street>\n"
     res << "    <gd:postcode>#{other[:postcode]}</gd:postcode>\n"
     res << "    <gd:city>#{other[:city]}</gd:city>\n"
      res << "    <gd:formattedAddress>#{other[:street]}\n#{other[:postcode]} #{other[:city]}</gd:formattedAddress>\n"
      res << "  </gd:structuredPostalAddress>\n"
    end
    # date of birth
    if @date_of_birth
      res << "  <gContact:birthday when=\"#{@date_of_birth}\" />\n"
    end
    # add contact groups
    @groups.each do |grp|
      res << "  <gContact:groupMembershipInfo deleted=\"false\" href=\"#{grp}\"/>\n"
    end
    @system_groups.each do |grp|
      res << "  <gContact:systemGroupMembershipInfo deleted=\"false\" href=\"#{grp}\"/>\n"
    end
    res << "</atom:entry>"
    res.strip
  end

  def parse_address(from, to)
    to[:street] = from.try(:street)
    to[:postcode] = from.try(:zip)
    to[:city] = from.try(:city)
  end

  def self.parse_user(usr)
    gc = GoogleContact.new()
    gc.name = usr.fullname
    gc.firstname = usr.firstname
    gc.lastname = usr.lastname
    gc.home_email << usr.email
    
    # home data
    gc.mobile_phone << usr.private_address.try(:mobile)
    gc.home_phone << usr.private_address.try(:phone)
    if usr.private_address.try(:email)
      gc.home_email << usr.private_address.try(:email)
    end
    gc.parse_address(usr.private_address, gc.home_address) if usr.private_address && usr.private_address.full_address?
    # work data
    gc.mobile_phone << usr.business_address.try(:mobile)
    gc.work_phone << usr.business_address.try(:phone)
    if usr.business_address.try(:email)
      gc.work_email << usr.business_address.try(:email)
    end
    gc.parse_address(usr.business_address, gc.work_address) if usr.business_address && usr.business_address.full_address?

    # other addresses
    usr.other_addresses.each do  |addr|
      o_addr = {}
      o_addr[:label] = addr.purpose
      gc.parse_address(addr, o_addr)
      gc.other_address << o_addr
    end
    gc.date_of_birth = usr.date_of_birth
    gc.clean_up
    gc
  end

  def self.parse_xml(usr)
    gc = GoogleContact.new()
    gc.my_xml = usr
    # checking for both formats: "lastname, firstname" and "firstname lastname"
    gc.name = gc.my_xml.at('title').content
    if gc.name.index(',')
      gc.firstname, gc.lastname = gc.name.split(',')
    else
      gc.firstname, gc.lastname = gc.name.split(' ')
    end
    gc.firstname.strip! if gc.firstname
    gc.lastname.strip! if gc.lastname
    # Rails.logger.debug("firstname lastname: #{gc.firstname} #{gc.lastname}")
    gc.parse_phones_xml
    gc.parse_emails_xml
    #gc.parse_addresses_xml
    gc.groups = GoogleContact::parse_groups(gc.my_xml)
    gc.edit_url = usr.search("link[rel=\"edit\"]").first['href']
    gc.self_url = usr.search("link[rel=\"self\"]").first['href']
    gc.date_of_birth = (usr.css("gContact|birthday").first ? usr.css("gContact|birthday").first['when'] : nil)
    gc
  end

  def self.parse_groups xml
    Rails.logger.warn("parsing groups...")
    groups = []
    xml.css("gContact|groupMembershipInfo").each do |grp|
      Rails.logger.debug("found group #{grp['href']}")
      groups << grp['href']
    end
    Rails.logger.warn("found #{groups.count} groups.")
    groups
  end

  def parse_emails_xml
    raise ("called parse_emails_xml but my_xml is undefined") unless @my_xml
    @my_xml.css("gd|email").each do |mail|
      next unless mail['rel']
      ident = mail['rel'].match(/http\:\/\/schemas\.google\.com\/g\/2005#(.*)/)
      case ident.captures[0]
      when 'work'
        @work_email << mail['address']
      when 'home'
        @home_email << mail['address']
      else
        Rails.logger.warn("can't deal with mail type #{ident.captures[0]}")
      end
    end
  end
  
  def parse_phones_xml
    raise ("called parse_phones_xml but my_xml is undefined") unless @my_xml
    @my_xml.css("gd|phoneNumber").each do |phone|
      next unless phone['rel']
      ident = phone['rel'].match(/http\:\/\/schemas\.google\.com\/g\/2005#(.*)/)
      case ident.captures[0]
      when 'work'
        @work_phone << phone.content
      when 'mobile'
        @mobile_phone << phone.content
      when 'home'
        @home_phone << phone.content
      else
        Rails.logger.warn("can't deal with phone type ident.captures[0]")
      end
    end
  end
  
  def clean_up
    # deleting empty values from arrays
    @home_address.delete_if {|key,val| val.nil? || val.strip.empty?} if @home_address
    @work_address.delete_if {|key,val| val.nil? || val.strip.empty?} if @work_address
    if @other_address
      @other_address.each do |addr|
        addr.delete_if {|key,val| val.nil? || val.strip.empty?} 
      end
    end
    @mobile_phone.delete_if {|k| k.nil? || k.strip.empty?} if @mobile_phone
    @home_phone.delete_if {|k| k.nil? || k.strip.empty?} if @home_phone
    @work_phone.delete_if {|k| k.nil? || k.strip.empty?} if @work_phone
    @home_email.delete_if {|k| k.nil? || k.strip.empty?} if @home_email
    @work_email.delete_if {|k| k.nil? || k.strip.empty?} if @work_email
    # removing duplicates
    @mobile_phone.uniq!
    @home_phone.uniq!
    @work_phone.uniq!
    @groups.uniq!
    @system_groups.uniq!
  end
  
end
