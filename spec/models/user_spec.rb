require File.dirname(__FILE__) + '/../spec_helper'

describe User do

  it { should validate_presence_of :firstname }
  it { should validate_presence_of :lastname }
  it { should validate_presence_of :date_of_birth }
  it { should validate_presence_of :matriculation_number }

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

  it "fails to assign the master mason status" do 
    master_without_fellow_craft = FactoryGirl.build(:user, :entered_apprentice_since => 5.years.ago, :master_mason_since => 3.years.ago)
    master_without_fellow_craft.should_not be_valid
#    master_without_fellow_craft.master_mason_since.should be_nil
  end

end
