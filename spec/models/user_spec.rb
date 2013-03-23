require File.dirname(__FILE__) + '/../spec_helper'

describe User do

  it { should validate_presence_of :firstname }
  it { should validate_presence_of :lastname }
  it { should validate_presence_of :date_of_birth }
  it { should validate_presence_of :matriculation_number }
  it { should validate_uniqueness_of :matriculation_number }
  it { should validate_uniqueness_of :email }

  it "creates a valid entered apprentice" do 
    FactoryGirl.build(:user, :entered_apprentice_since => 5.years.ago).should be_valid
    FactoryGirl.build(:user, :entered_apprentice_since => 5.years.ago).rome_degree
  end

  it "creates a valid fellow craft" do 
    FactoryGirl.build(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago).should be_valid
  end

  it "creates a valid master mason" do 
    FactoryGirl.build(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago).should be_valid
  end

  it "requires an at sign" do
    should_not allow_value("simple_string_without_at").for(:email)
  end

  it "reqjects a too short domain" do
    should_not allow_value("user@d.com").for(:email)
  end

  it "requires a TLD" do 
    should_not allow_value("user@domain").for(:email)
  end

  it "expects a TLD length of two char at minumum" do
    should_not allow_value("user@domain.e").for(:email)
  end

  it "allows a valid email address" do 
    should allow_value("user@domain.de").for(:email)
  end

  it "requires a password length of 8 at minimum" do
    should_not allow_value("123456").for(:password)
    should_not allow_value("1234567").for(:password)
    should allow_value("12345678").for(:password)
  end

  it "fails to assign the master mason status" do 
    master_without_fellow_craft = FactoryGirl.build(:user, :entered_apprentice_since => 5.years.ago, :master_mason_since => 3.years.ago)
    master_without_fellow_craft.should_not be_valid
#    master_without_fellow_craft.master_mason_since.should be_nil
  end

  context "upcoming birthdays" do
    it "does not return birthdays of deleted users" do
      usr = FactoryGirl.create(:user, :date_of_birth => '01.01.1990')
      User.upcoming_birthdays('01.01.1990', '01.01.1990').should include(usr)
      usr.deleted = true
      usr.save
      User.upcoming_birthdays('01.01.1990', '01.01.1990').should_not include(usr)
    end
  end
end
