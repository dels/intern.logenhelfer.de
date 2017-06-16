class GoogleContact

  attr_accessor :assoc_usr, :name, :primary_email_addr, :email_addrs, :phone, :my_json, :priv_addr, :business_addr, :edit_href, :home_phone, :mobile_phone, :work_phone
  
  def initialize(json=nil)
    return unless json
    @my_json = json
    @name = json["title"]["$t"] rescue nil
    parse_email_addrs()
    parse_phones()
  end

  def valid?
    @edit_href
  end

  def self.parse_user(usr)
    gc = GoogleContact.new()
    gc.assoc_usr = usr
    gc.name = usr.fullname
    gc.primary_email_addr = usr.email
    gc.home_phone = usr.private_address.try(:phone)
    gc.mobile_phone = usr.private_address.try(:mobile)
    gc.work_phone = usr.business_address.try(:phone)
    Rails.logger.info("returning #{gc.to_s}")
    gc
  end

  def to_s
    return @name if @name
    return @primary_email_addr if @primary_email_addr
    Rails.logger.fatal("neither name nor email set from json: #{@my_json}")
    nil
  end

  def to_json
    res = ""
    
  end
  
  def to_atom
    return nil unless @assoc_usr
    res = ""
    res << "<atom:entry xmlns=\"http://www.w3.org/2005/Atom\" xmlns:gd=\"http://schemas.google.com/g/2005\">"
    res << "<gd:name>"
    res << " <gd:givenName>#{@assoc_usr.firstname}</gd:givenName>"
    res << "  <gd:familyName>#{@assoc_usr.lastname}</gd:familyName>"
    res << "  <gd:fullName>#{@assoc_usr.firstname} #{@assoc_usr.lastname}</gd:fullName>"
    res << "</gd:name>"
    res << "<atom:content type=\"text\">Notes</atom:content>"
    res << "<gd:email>"
    res << "  rel=\"http://schemas.google.com/g/2005#home\""
    res << "  primary=\"true\""
    res << "  address="#{@assoc_usr.email}" displayName="E. Bennet"/>"
    res << "</gd:email>"
    if @work_phone
      res << "<gd:phoneNumber rel=\"http://schemas.google.com/g/2005#work\">"
      res << @work_phone
      res << "</gd:phoneNumber>"
    end
    if @home_phone
      res << "<gd:phoneNumber rel=\"http://schemas.google.com/g/2005#home\">"
      res << @home_phone
      res << "</gd:phoneNumber>"
   end
    if @mobile_phone
      res << "<gd:phoneNumber rel=\"http://schemas.google.com/g/2005#mobile primary='true'\">"
      res << @mobile_phone
      res << "</gd:phoneNumber>"
    end
    
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
    res
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
