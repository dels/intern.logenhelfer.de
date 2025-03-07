require File.dirname(__FILE__) + '/../spec_helper'

describe Lodge do
  it "should be valid" do
    Lodge.new.should be_valid
  end
end
