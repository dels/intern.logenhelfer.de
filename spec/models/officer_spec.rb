require File.dirname(__FILE__) + '/../spec_helper'

describe Officer do
  it "should be valid" do
    Officer.new.should be_valid
  end
end
