require File.dirname(__FILE__) + '/../spec_helper'

describe Announcement do
  it "should be valid" do
    Announcement.new.should be_valid
  end
end
