require 'test_helper'

class AttachedFilesControllerTest < ActionController::TestCase
  def test_index
    get :index
    assert_template 'index'
  end

  def test_show
    get :show, :id => AttachedFile.first
    assert_template 'show'
  end

  def test_new
    get :new
    assert_template 'new'
  end

  def test_create_invalid
    AttachedFile.any_instance.stubs(:valid?).returns(false)
    post :create
    assert_template 'new'
  end

  def test_create_valid
    AttachedFile.any_instance.stubs(:valid?).returns(true)
    post :create
    assert_redirected_to attached_file_url(assigns(:attached_file))
  end

  def test_edit
    get :edit, :id => AttachedFile.first
    assert_template 'edit'
  end

  def test_update_invalid
    AttachedFile.any_instance.stubs(:valid?).returns(false)
    put :update, :id => AttachedFile.first
    assert_template 'edit'
  end

  def test_update_valid
    AttachedFile.any_instance.stubs(:valid?).returns(true)
    put :update, :id => AttachedFile.first
    assert_redirected_to attached_file_url(assigns(:attached_file))
  end

  def test_destroy
    attached_file = AttachedFile.first
    delete :destroy, :id => attached_file
    assert_redirected_to attached_files_url
    assert !AttachedFile.exists?(attached_file.id)
  end
end
