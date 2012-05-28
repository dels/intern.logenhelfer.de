class Address < ActiveRecord::Base
  attr_accessible :purpose, :street1, :street2, :street3, :mobile,
      :zip, :city, :phone, :fax, :email, :remarks, :type_of_address

  default_scope where(:deleted => false)

  validates_presence_of :purpose, :type_of_address
  validates_numericality_of :type_of_address, :greater_or_equal => 0, :less_or_equal => 3

  TYPES = {
    :private => 0,
    :business => 1,
    :other => 2
  }

  TYPES.each_pair{|type,id|
    self.class_eval %{
      def #{type}?
        type_of_address == #{id}
      end
    }
  }

  belongs_to :addressable, :polymorphic => true

  def purpose
    return read_attribute(:purpose) if type_of_address == 2 || type_of_address.blank?
    I18n.t("activerecord.address.#{TYPES.rassoc(type_of_address)[0]}")
  end

  def street
    # XXX: for educational reasons, I won't delete this:
    # return ""                       if street1.blank?
    # return street1                  if street2.blank? && street3.blank?
    # return "#{street1}\n#{street3}" if street2.blank? && street3.present?
    # "#{street1}\n#{street2}\n#{street3}"

    [street1, street2, street3].compact.join("\n")
  end

  def vcf_type
    return "home" if private?
    return "work" if business?
    purpose
  end

end
