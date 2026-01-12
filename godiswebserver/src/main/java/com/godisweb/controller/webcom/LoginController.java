package com.godisweb.controller.webcom;

import com.godisweb.service.webcom.LoginService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webcom")
@CrossOrigin
public class LoginController {
    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/getlogin")
    public Map<String, Object> getLogin(Map<String, Object> param) {
        return loginService.getLogin(param);
    }
}
