class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

      private
    def token_auth
      session[:return_to] = request.fullpath unless request.fullpath == "/config/auth"
      token = session[:token]
      token_date = session[:token_date]
      unless token.present? && token_date #&& valid_token?(token)
        redirect_to config_auth_path
      end
    end


    
end
