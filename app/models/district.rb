class District < ActiveRecord::Base
  attr_accessible :slug, :name

  default_scope where(:deleted => false)
  default_scope order('name ASC')
end
