module ActsAsAddressable

  def self.included(base)
    base.extend ClassMethods
    base.send(:include, InstanceMethods)
  end

  module ClassMethods
    def acts_as_addressable(options = {})
      options = {
        :has_many => true
      }.merge(options)

      cattr_accessor :_has_many_addresses
      self._has_many_addresses = options[:has_many]
      if options[:has_many]
        has_many :addresses, :as => :addressable
        attr_accessible :addresses_attributes
        accepts_nested_attributes_for :addresses, :reject_if => :all_blank, :allow_destroy => true
        alias_method_chain :addresses, :autobuild
      else
        has_one :address, :as => :addressable
        attr_accessible :address_attributes
        accepts_nested_attributes_for :address, :reject_if => :all_blank, :allow_destroy => true
        alias_method_chain :address, :autobuild
      end
    end

    def has_one_address
      acts_as_addressable :has_many => false
    end

    def has_many_addresses
      acts_as_addressable :has_many => true
    end
  end # module ClassMethods

  module InstanceMethods
    def address_with_autobuild
      address_without_autobuild || build_address
    end

    def addresses_with_autobuild
      addresses_without_autobuild || addresses.build
    end
    
    def first_phone_number
      addresses.each do |address|
        return address.phone if address.phone
      end
      return ""
    end
  end # module InstanceMethods

end # module ActsAsAddressable

