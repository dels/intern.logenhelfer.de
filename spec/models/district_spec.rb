require File.dirname(__FILE__) + '/../spec_helper'

describe District do
  it "should be valid" do
    District.new.should be_valid
  end
end
