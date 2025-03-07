class AddTypeOfAddressToAddresses < ActiveRecord::Migration
  def change
    add_column :addresses, :type_of_address, :integer
  end
end
