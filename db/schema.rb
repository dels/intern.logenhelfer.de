# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20121114220659) do

  create_table "addresses", :force => true do |t|
    t.integer  "addressable_id"
    t.string   "addressable_type"
    t.string   "purpose"
    t.string   "street1"
    t.string   "street2"
    t.string   "street3"
    t.string   "zip"
    t.string   "city"
    t.string   "phone"
    t.string   "fax"
    t.string   "email"
    t.text     "remarks"
    t.boolean  "deleted",          :default => false
    t.datetime "created_at",                          :null => false
    t.datetime "updated_at",                          :null => false
    t.integer  "type_of_address"
    t.string   "mobile"
  end

  create_table "attached_file_roles", :force => true do |t|
    t.integer  "attached_file_id"
    t.integer  "role_id"
    t.datetime "created_at",       :null => false
    t.datetime "updated_at",       :null => false
  end

  add_index "attached_file_roles", ["attached_file_id"], :name => "index_attached_file_roles_on_attached_file_id"
  add_index "attached_file_roles", ["role_id"], :name => "index_attached_file_roles_on_role_id"

  create_table "attached_files", :force => true do |t|
    t.string   "uuid",           :limit => 36
    t.string   "filename"
    t.binary   "content"
    t.string   "content_type"
    t.integer  "directory_id"
    t.integer  "uploader_id"
    t.boolean  "deleted",                      :default => false
    t.datetime "created_at",                                      :null => false
    t.datetime "updated_at",                                      :null => false
    t.integer  "content_length",               :default => -1
  end

  add_index "attached_files", ["deleted"], :name => "index_attached_files_on_deleted"
  add_index "attached_files", ["directory_id"], :name => "index_attached_files_on_directory_id"
  add_index "attached_files", ["filename"], :name => "index_attached_files_on_filename"

  create_table "categories", :force => true do |t|
    t.string   "name"
    t.text     "description"
    t.boolean  "deleted",     :default => false
    t.datetime "created_at",                     :null => false
    t.datetime "updated_at",                     :null => false
    t.string   "slug"
  end

  add_index "categories", ["slug"], :name => "index_categories_on_slug"

  create_table "category_roles", :force => true do |t|
    t.integer  "category_id"
    t.integer  "role_id"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
  end

  add_index "category_roles", ["category_id"], :name => "index_category_roles_on_category_id"
  add_index "category_roles", ["role_id"], :name => "index_category_roles_on_role_id"

  create_table "directories", :force => true do |t|
    t.string   "name"
    t.text     "description"
    t.integer  "category_id"
    t.boolean  "deleted",     :default => false
    t.datetime "created_at",                     :null => false
    t.datetime "updated_at",                     :null => false
    t.string   "slug"
  end

  add_index "directories", ["category_id"], :name => "index_directories_on_category_id"
  add_index "directories", ["deleted"], :name => "index_directories_on_deleted"
  add_index "directories", ["slug"], :name => "index_directories_on_slug"

  create_table "directory_roles", :force => true do |t|
    t.integer  "directory_id"
    t.integer  "role_id"
    t.datetime "created_at",   :null => false
    t.datetime "updated_at",   :null => false
  end

  add_index "directory_roles", ["directory_id"], :name => "index_directory_roles_on_directory_id"
  add_index "directory_roles", ["role_id"], :name => "index_directory_roles_on_role_id"

  create_table "events", :force => true do |t|
    t.string   "title"
    t.text     "public_description"
    t.text     "private_description"
    t.boolean  "whole_day"
    t.integer  "created_by_id"
    t.integer  "updated_by_id"
    t.boolean  "deleted",             :default => false
    t.datetime "created_at",                             :null => false
    t.datetime "updated_at",                             :null => false
    t.date     "date",                                   :null => false
    t.time     "time",                                   :null => false
  end

  add_index "events", ["created_by_id"], :name => "index_events_on_created_by_id"
  add_index "events", ["updated_by_id"], :name => "index_events_on_updated_by_id"

  create_table "file_downloads", :force => true do |t|
    t.integer  "attached_file_id"
    t.integer  "user_id"
    t.string   "remote_ip"
    t.boolean  "deleted",          :default => false
    t.datetime "created_at",                          :null => false
    t.datetime "updated_at",                          :null => false
  end

  add_index "file_downloads", ["deleted"], :name => "index_file_downloads_on_deleted"
  add_index "file_downloads", ["user_id"], :name => "index_file_downloads_on_user_id"

  create_table "roles", :force => true do |t|
    t.string   "name"
    t.string   "description"
    t.datetime "created_at",                      :null => false
    t.datetime "updated_at",                      :null => false
    t.string   "display_name"
    t.boolean  "group",        :default => false
  end

  create_table "user_roles", :force => true do |t|
    t.integer  "user_id"
    t.integer  "role_id"
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
    t.date     "role_added_at"
  end

  create_table "users", :force => true do |t|
    t.string   "email",                  :default => "",    :null => false
    t.string   "encrypted_password",     :default => "",    :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at",                                :null => false
    t.datetime "updated_at",                                :null => false
    t.string   "uuid"
    t.string   "firstname"
    t.string   "lastname"
    t.date     "date_of_birth"
    t.date     "accepted_at"
    t.boolean  "deleted",                :default => false
    t.integer  "matriculation_number"
    t.string   "job_title"
    t.integer  "title"
  end

  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

end
