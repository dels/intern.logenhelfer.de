class GoogleContact

  attr_accessor :firstname, :lastname, :name, :home_email, :work_email, :mobile_phone, :home_phone, :work_phone, :date_of_birth, :priv_addr, :business_addr, :edit_href, :my_json, :my_xml, :edit_url, :self_url
  
  def initialize(json=nil)
    @email_addrs = []
    return unless json
    @my_json = json
    @name = json["title"]["$t"] rescue nil
    parse_email_addrs()
    parse_phones()
  end

  def self.parse_user(usr)
    gc = GoogleContact.new()
    gc.name = usr.fullname
    gc.firstname = usr.firstname
    gc.lastname = usr.lastname
    gc.home_email = usr.email
    gc.work_email = usr.private_address.email
    gc.home_phone = usr.private_address.try(:phone)
    gc.mobile_phone = usr.private_address.try(:mobile)
    gc.work_phone = usr.business_address.try(:phone)
    gc.date_of_birth = usr.date_of_birth
    gc
  end

  def self.parse_xml(usr)
    gc = GoogleContact.new()
    gc.my_xml = usr
    # TODO check format of firstname/lastname if there is a comma and names are confused
    gc.name = gc.my_xml.at('title').content
    if gc.name.index(',')
      gc.firstname, gc.lastname = gc.name.split(',')
    else
      gc.firstname, gc.lastname = gc.name.split(' ')
    end
    gc.firstname.strip!
    gc.lastname.strip!
    Rails.logger.debug("firstname lastname: #{gc.firstname} #{gc.lastname}")
    gc.parse_phones_xml
    gc.parse_emails_xml
    gc.edit_url = usr.search("link[rel=\"edit\"]").first['href']
    gc.self_url = usr.search("link[rel=\"self\"]").first['href']
    gc
  end

  def parse_emails_xml
    unless @my_xml
      Rails.logger.fatal("called parse_emails_xml but my_xml is undefined")
      return
    end
    @my_xml.css("gd|email").each do |mail|
      next unless mail['rel']
      ident = mail['rel'].match(/http\:\/\/schemas\.google\.com\/g\/2005#(.*)/)
      case ident.captures[0]
      when 'work'
        @work_email = mail['address']
      when 'home'        
        @home_email = mail['address']
      else
        Rails.logger.warn("can't deal with mail type #{ident.captures[0]}")
      end
    end
  end
  
  def parse_phones_xml
    unless @my_xml
      Rails.logger.fatal("called parse_phones_xml but my_xml is undefined")
      return
    end
    @my_xml.css("gd|phoneNumber").each do |phone|
      next unless phone['rel']
      ident = phone['rel'].match(/http\:\/\/schemas\.google\.com\/g\/2005#(.*)/)
      case ident.captures[0]
      when 'work'
        @work_phone = phone.content
      when 'mobile'
        @mobile_phone = phone.content
      when 'home'
        @home_phone = phone.content
      else
        Rails.logger.warn("can't deal with phone type ident.captures[0]")
      end
    end
  end
  
  def to_s
    return @name if @name
    return @primary_email_addr if @primary_email_addr
    Rails.logger.fatal("neither name nor email set from json: #{@my_json}")
    nil
  end
  
  def to_atom
    res = ""
    # xmlns:batch='http://schemas.google.com/gdata/batch'
    res << "<atom:entry xmlns:atom='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005' xmlns:gContact='http://schemas.google.com/contact/2008'>\n"
    res << "  <atom:category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/contact/2008#contact'/>\n"
    res << "  <gd:name>\n"
    res << "     <gd:givenName>#{@firstname}</gd:givenName>\n"
    res << "      <gd:familyName>#{@lastname}</gd:familyName>\n"
    res << "      <gd:fullName>#{@firstname} #{@lastname}</gd:fullName>\n"
    res << "  </gd:name>\n"
    res << "  <atom:content type=\"text\">Notes</atom:content>\n"
    # walk through all mails
    if @home_email
      res << "  <gd:email rel='http://schemas.google.com/g/2005#home' primary='true' address='#{@home_email}'/>\n"
    end
    if @work_email
      res << "  <gd:email rel='http://schemas.google.com/g/2005#work' address='#{@work_email}'/>\n"
    end
    
    # walk through all phone numbers

    if @mobile_phone
      res << "  <gd:phoneNumber rel='http://schemas.google.com/g/2005#mobile'  primary='true'>#{@mobile_phone}</gd:phoneNumber>\n"
    end
    if @home_phone
      res << "  <gd:phoneNumber rel='http://schemas.google.com/g/2005#home'>#{@home_phone}</gd:phoneNumber>\n"
    end
    if @work_phone
      res << "  <gd:phoneNumber rel='http://schemas.google.com/g/2005#work'>#{@work_phone}</gd:phoneNumber>\n"
    end
    res << "  <gContact:birthday when='#{@date_of_birth}'/>\n"
    # walk through all addresses
=begin
    <gd:structuredPostalAddress
      rel="http://schemas.google.com/g/2005#work"
      primary="true">
    <gd:city>Mountain View</gd:city>
    <gd:street>1600 Amphitheatre Pkwy</gd:street>
    <gd:region>CA</gd:region>
    <gd:postcode>94043</gd:postcode>
    <gd:country>United States</gd:country>
    <gd:formattedAddress>
      1600 Amphitheatre Pkwy Mountain View
    </gd:formattedAddress>
  </gd:structuredPostalAddress>

=end
    res << "</atom:entry>"
    res.strip
  end
  
  
  private

  def parse_phones
    return unless @my_json["gd$phoneNumber"]
    @my_json["gd$phoneNumber"].each do |phone|
      next unless phone["rel"]
      type = phone["rel"][phone["rel"].index("#")..phone["rel"].length]
      case type
      when "#home"
        @home_phone = phone["$t"]
      when "#mobile"
        @mobile_phone = phone["$t"]
      when "#work"
        @work_phone = phone["$t"]
      else Rails.logger.warn("don't know type #{type} for phone")
      end
    end
  end
  
  def parse_email_addrs
    cur_mail = nil
    return nil unless @my_json["gd$email"]
    @email_addrs = []
    @my_json["gd$email"].each do |mail_addr|
      next unless mail_addr["address"]
      @email_addrs << mail_addr["address"]
      @primary_email_addr = mail_addr["address"] if mail_addr["primary"]
    end
  end
  
end

=begin
<atom:entry xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:gd="http://schemas.google.com/g/2005">
  <atom:category scheme="http://schemas.google.com/g/2005#kind"
    term="http://schemas.google.com/contact/2008#contact"/>
  <gd:name>
     <gd:givenName>Elizabeth</gd:givenName>
     <gd:familyName>Bennet</gd:familyName>
     <gd:fullName>Elizabeth Bennet</gd:fullName>
  </gd:name>
  <atom:content type="text">Notes</atom:content>
  <gd:email rel="http://schemas.google.com/g/2005#work"
    primary="true"
    address="liz@gmail.com" displayName="E. Bennet"/>
  <gd:email rel="http://schemas.google.com/g/2005#home"
    address="liz@example.org"/>
  <gd:phoneNumber rel="http://schemas.google.com/g/2005#work"
    primary="true">
    (206)555-1212
  </gd:phoneNumber>
  <gd:phoneNumber rel="http://schemas.google.com/g/2005#home">
    (206)555-1213
  </gd:phoneNumber>
  <gd:im address="liz@gmail.com"
    protocol="http://schemas.google.com/g/2005#GOOGLE_TALK"
    primary="true"
    rel="http://schemas.google.com/g/2005#home"/>
  <gd:structuredPostalAddress
      rel="http://schemas.google.com/g/2005#work"
      primary="true">
    <gd:city>Mountain View</gd:city>
    <gd:street>1600 Amphitheatre Pkwy</gd:street>
    <gd:region>CA</gd:region>
    <gd:postcode>94043</gd:postcode>
    <gd:country>United States</gd:country>
    <gd:formattedAddress>
      1600 Amphitheatre Pkwy Mountain View
    </gd:formattedAddress>
  </gd:structuredPostalAddress>
</atom:entry>

=end


=begin
    
 {
   "id": {
     "$t": "http://www.google.com/m8/feeds/contacts/dominik.elsbroek%40gmail.com/base/637085db88c1090d"
   },
   "updated": {
     "$t": "2016-10-06T03:46:05.473Z"
   },
   "category": [
     {
       "scheme": "http://schemas.google.com/g/2005#kind",
       "term": "http://schemas.google.com/contact/2008#contact"
     }
   ],
   "title": {
     "type": "text",
     "$t": "Frederik Elsbroek"
   },
   "link": [
     {
       "rel": "http://schemas.google.com/contacts/2008/rel#edit-photo",
       "type": "image/*",
       "href": "https://www.google.com/m8/feeds/photos/media/dominik.elsbroek%40gmail.com/637085db88c1090d/1B2M2Y8AsgTpgAmY7PhCfg"
     },
     {
       "rel": "self",
       "type": "application/atom+xml",
       "href": "https://www.google.com/m8/feeds/contacts/dominik.elsbroek%40gmail.com/full/637085db88c1090d"
     },
     {
       "rel": "edit",
       "type": "application/atom+xml",
       "href": "https://www.google.com/m8/feeds/contacts/dominik.elsbroek%40gmail.com/full/637085db88c1090d/1475725565473000"
     }
   ],
   "gd$email": [
     {
       "address": "freddyelsbroek@googlemail.com",
       "primary": "true",
       "rel": "http://schemas.google.com/g/2005#other"
     },
     {
       "address": "freddyelsbroek@gmx.de",
       "rel": "http://schemas.google.com/g/2005#other"
     },
     {
       "address": "Frederik.Elsbroek@timbergreen.de",
       "rel": "http://schemas.google.com/g/2005#other"
     }
   ],
   "gd$phoneNumber": [
     {
       "rel": "http://schemas.google.com/g/2005#mobile",
       "primary": "true",
       "uri": "tel:+49-172-1843289",
       "$t": "+49 172 184 328 9"
     },
     {
       "rel": "http://schemas.google.com/g/2005#home",
       "uri": "tel:+49-4261-3059874",
       "$t": "+49 4261 305 987 4"
     }
   ],
   "gContact$groupMembershipInfo": [
     {
       "deleted": "false",
       "href": "http://www.google.com/m8/feeds/groups/dominik.elsbroek%40gmail.com/base/3ed41d250d8daca2"
     }
   ],
   "gd$extendedProperty": [
     {
       "$t": "<cc>0</cc>",
       "name": "GCon",
       "xmlns$": ""
     }
   ]
 }

=end
