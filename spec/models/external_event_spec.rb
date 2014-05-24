require File.dirname(__FILE__) + '/../spec_helper'

describe ExternalEvent do
  it "should be valid" do
    ExternalEvent.new.should be_valid
  end
end
