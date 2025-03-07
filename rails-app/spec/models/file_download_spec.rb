require File.dirname(__FILE__) + '/../spec_helper'

describe FileDownload do
  it "should be valid" do
    FileDownload.new.should be_valid
  end
end
