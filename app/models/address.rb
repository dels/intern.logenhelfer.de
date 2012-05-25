class Address < ActiveRecord::Base
  attr_accessible :purpose, :street1, :street2, :street3,
      :zip, :city, :phone, :fax, :email, :remarks

  default_scope where(:deleted => false)

  belongs_to :addressable, :polymorphic => true
end
