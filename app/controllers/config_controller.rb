class ConfigController < ApplicationController

    before_action :check_auth, except: %i[auth login logout]
    def show
    end

    def auth
    end
    def login 
        token_login
    end
    def logout
        token_logout
    end

    private
    def check_auth
        if not check_token
            cookies.delete(:thaqqa_token)
            redirect_to config_auth_path, alert: "端末上のログイン情報が不正です。お手数ですが、もう一度ログインしてください。"
        end
    end
    def check_token
        token = cookies.encrypted[:thaqqa_token]
        # Cookieにトークンが存在しない
        return false if token.blank?

        begin
            res = Faraday.post("#{ENV.fetch("THAQQA_API_URL")}/thaqqa/verificate/") do |req|
            req.headers["Authorization"] = "Bearer #{token}"
            end

            # HTTPステータスが2xx以外
            return false unless res.success?

            data = JSON.parse(res.body)

            # Elixir APIのレスポンスが {"ok": ...} という形式の場合
            data["ok"].present?
        rescue Faraday::Error, JSON::ParserError
            false
        end
    end

    def token_logout
        cookies.delete(:thaqqa_token)
        redirect_to config_auth_path, notice: "ログアウトしました"
    end
    def token_login
        token = params[:token]
        res = Faraday.post("#{ENV.fetch("THAQQA_API_URL")}/thaqqa/verificate") do |req|
            req.headers["Content-Type"] = "application/json"
            req.headers["Authorization"] = "Bearer #{token}"
        end
        if res.success?
            data = JSON.parse(res.body)
            if data["ok"] 
                cookies.encrypted[:thaqqa_token] = {
                value: token,
                expires: 1.days.from_now,
                httponly: true,
                secure: Rails.env.production?,
                same_site: :lax
                }
            end
            redirect_to config_path, notice: "ログインに成功しました"
        else
            redirect_to config_auth_path, alert: "ログインに失敗しました"
        end
    end

end
