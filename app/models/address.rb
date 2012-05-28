class Address < ActiveRecord::Base
  attr_accessible :purpose, :street1, :street2, :street3,
      :zip, :city, :phone, :fax, :email, :remarks, :type_of_address

  default_scope where(:deleted => false)

  validates_presence_of :purpose, :type_of_address
  validates_numericality_of :type_of_address, :greater_or_equal => 0, :less_or_equal => 3


  TYPES = {
    :private => 0,
    :business => 1,
    :other => 2
  }

  belongs_to :addressable, :polymorphic => true

  def purpose
    return purpose if 2 == type_of_address
    "activerecord.address.#{TYPES.rassoc(type_of_address)[0]}"
  end

end
