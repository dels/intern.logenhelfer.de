class Address < ActiveRecord::Base
  attr_accessible :purpose, :street1, :street2, :street3, :mobile,
      :zip, :city, :phone, :fax, :email, :remarks, :type_of_address

  belongs_to :addressable, polymorphic: true

  default_scope where(:deleted => false)

  RE_DIAL_NUMBER = /\A\+\d{1,4}\s\([^0]\d{1,5}\)\s[\d\s]*[-]?[\s]?[\d]+\z/

  validates_presence_of     :purpose, :type_of_address
  validates_numericality_of :type_of_address, :greater_or_equal => 0, :less_or_equal => 3
  validates_format_of :mobile, :phone, :fax,
      with: RE_DIAL_NUMBER, allow_blank: true, allow_nil: true

  TYPES = {
    private:  0,
    business: 1,
    other:    2
  }

  TYPES.each_pair{|type,id|
    self.class_eval %{
      def #{type}?
        type_of_address == #{id}
      end
    }
  }

  def purpose
    return read_attribute(:purpose) if type_of_address == 2 || type_of_address.blank?
    I18n.t("activerecord.address.#{TYPES.rassoc(type_of_address)[0]}")
  end

  def street
    [street1, street2, street3].compact.join("\n").strip
  end

  def vcf_type
    return "home" if private?
    return "work" if business?
    purpose
  end

  def to_s
    return "" if(street.strip && street.strip.empty?)
    [street, "#{zip} #{city}"].compact.join(", ")
  end
end
