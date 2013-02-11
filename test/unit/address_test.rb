require 'test_helper'

class AddressTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end


  test "test mandatory fields" do
    assert(false == Address.new.save, "can save empty address (without purpose and type of address)")
    addr = Address.new
    addr.purpose = 0
    assert(false == addr.save, "can save address without type of address but with purpose")
    addr.type_of_address = 2
    addr.purpose = nil
    assert(false == addr.save, "can save address without purpose but with type of address 2")
    addr.type_of_address = 0
    addr.purpose = nil # purpose is now private
    assert(addr.save, "can't save address with type of address of 0 and without purpose")
    addr.type_of_address = 1
    addr.purpose = nil # purpose is now business
    assert(addr.save, "can't save address with type of address of 1 and without purpose")
    addr.type_of_address = 2
    addr.purpose = "Wochenendhaus"
    assert(addr.save, "can't save address with type of address of 2 and with purpose")
  end

  test "format of phone, fax and mobile" do
    addr.type_of_address = 0
    addr.purpose = nil # purpose is now private
    assert(addr.save, "can't save address with type of address of 0 and without purpose")
    phone = '+49 (123) 22 22 22 22'
    addr.phone = phone
    assert(addr.valid?, "addr is invalid with phone #{phone}")
    phone = '+49 (123) 22 22 22-22'
    addr.phone = phone
    assert(addr.valid?, "addr is invalid with phone #{phone}")
    phone = '+49 (123) 22 22 22 - 22'
    addr.phone = phone
    assert(addr.valid?, "addr is invalid with phone #{phone}")
    phone = '+49 (123) 22222222'
    addr.phone = phone
    assert(addr.valid?, "addr is invalid with phone #{phone}")
    phone = '+49 (123) 222222-22'
    addr.phone = phone
    assert(addr.valid?, "addr is invalid with phone #{phone}")
    phone = '+49 (11234) 22 22 22 22'
    addr.phone = phone
    assert(addr.valid?, "addr is invalid with phone #{phone}")
    

    phone = '+49 (089) 22 22 22 22'
    addr.phone = phone
    assert(false == addr.valid?, "addr is valid with phone #{phone}")
    phone = '9 (89) 22 22 22 22'
    addr.phone = phone
    assert(false == addr.valid?, "addr is valid with phone #{phone}")
    phone = '49 (89) 22 22 22 22'
    addr.phone = phone
    assert(false == addr.valid?, "addr is valid with phone #{phone}")
    phone = '0049 (89) 22 22 22 22'
    addr.phone = phone
    assert(false == addr.valid?, "addr is valid with phone #{phone}")
    phone = '+49 89 22 22 22 22'
    addr.phone = phone
    assert(false == addr.valid?, "addr is valid with phone #{phone}")
    phone = '+49 (089) 22 22 22 22'
    addr.phone = phone
    assert(false == addr.valid?, "addr is valid with phone #{phone}")


  end

end
