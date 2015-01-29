require File.dirname(__FILE__) + '/../spec_helper'

describe Seeker do
  it "should be valid" do
    Seeker.new.should be_valid
  end
end
