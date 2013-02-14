require File.dirname(__FILE__) + '/../spec_helper'


describe Address do

  it "should not be valid without type of address and purpose" do
    addr = Address.new
    addr.should_not be_valid
  end

  it "should not be valid without type of address" do
    addr = Address.new
    addr.purpose = 0
    addr.should_not be_valid
  end


  it "should not be valid with type of address 2 and no purpose" do
    addr = Address.new
    addr.type_of_address = 2
    addr.purpose = nil
    addr.should_not be_valid
  end


  it "should be valid with type of address 0 and no purpose" do
    addr = Address.new
    addr.type_of_address = 0
    addr.purpose = nil # purpose is now private
    addr.should be_valid
  end

  it "should be valid with type of address 1 and no purpose" do
    addr = Address.new
    addr.type_of_address = 1
    addr.purpose = nil # purpose is now business
    addr.should be_valid
  end


  it "should be valid with type of address 2 and purpose" do
    addr = Address.new
    addr.type_of_address = 2
    addr.purpose = "Wochenendhaus"
    addr.should be_valid
  end


  describe "format of phone" do
    it "should be valid with correct international area code, valid area, and gouped number" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '+49 (123) 22 22 22 22'
      addr.should be_valid
    end

    it "should be valid with correct international area code, valid area code, and dial through number but without spaces next to dash" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '+49 (123) 22 22 22-22'
      addr.should be_valid
    end

    it "should be valid with correct international area code, valid area code, and dial through number with spaces next to dash" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '+49 (123) 22 22 22 - 22'
      addr.should be_valid
    end

    it "should be valid with correct international area code, valid area code, and without grouping" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '+49 (123) 22222222'
      addr.should be_valid
    end

    it "should be valid with correct international area code, valid area code, and dial through number without grouping" do 
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '+49 (123) 222222-22'
      addr.should be_valid
    end

    it "should be valid with correct single digit international area code, valid area code, and dial through grouped number" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '+1 (11234) 22 22 22 22'
      addr.should be_valid
    end

    it "should not be valid with correct international area code, but leading zero in area code and grouped number" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '+49 (089) 22 22 22 22'
      addr.should_not be_valid
    end


    it "should not be valid without international area code, correct area code, and grouped number" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '(89) 22 22 22 22'
      addr.should_not be_valid
    end



    it "should not be valid without leading plus in international area code, correct area code, and grouped number" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '49 (89) 22 22 22 22'
      addr.should_not be_valid
    end

    it "is not valid with doule zero in international area code, correct area code, and grouped number" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '0049 (89) 22 22 22 22'
      addr.should_not be_valid
    end

    it "is not valid with valid international area code, but not brackets enclosing the area code, and grouped number" do
      addr = Address.new
      addr.type_of_address = 0
      addr.phone = '+49 89 22 22 22 22'
      addr.should_not be_valid
    end
  end
end

