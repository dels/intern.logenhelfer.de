require File.dirname(__FILE__) + '/../spec_helper'

describe AttachedFilesController do
  render_views

  shared_examples_for "AnonymousUser" do 

    it "index action should render index template" do
      get :index
      response.should_not be_success
      response.should redirect_to(:login)
    end

#  it "show action should render show template" do
#    
#    get :show, :id => FileDownload.first
#    response.should render_template(:show)
#  end

    it "new action should render new template" do
      get :new
      response.should_not be_success
      response.should redirect_to(:login)
    end

#  it "create action should render new template when model is invalid" do
#    FileDownload.any_instance.stubs(:valid?).returns(false)
#    post :create
#    response.should render_template(:new)
#  end

#  it "create action should redirect when model is valid" do
#    FileDownload.any_instance.stubs(:valid?).returns(true)
#    post :create
#    response.should redirect_to(file_download_url(assigns[:file_download]))
#  end

#  it "edit action should render edit template" do
#    get :edit, :id => FileDownload.first
#    response.should render_template(:edit)
#  end

#  it "update action should render edit template when model is invalid" do
#    FileDownload.any_instance.stubs(:valid?).returns(false)
#    put :update, :id => FileDownload.first
#    response.should render_template(:edit)
#  end

#  it "update action should redirect when model is valid" do
#    FileDownload.any_instance.stubs(:valid?).returns(true)
#    put :update, :id => FileDownload.first
#    response.should redirect_to(file_download_url(assigns[:file_download]))
#  end

#  it "destroy action should destroy model and redirect to index action" do
#    file_download = FileDownload.first
#    delete :destroy, :id => file_download
#    response.should redirect_to(file_downloads_url)
#    FileDownload.exists?(file_download.id).should be_false
#  end
  end
end
