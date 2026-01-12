package com.godisweb.controller.webcom;

import com.godisweb.service.webcom.MainService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * REST controller that exposes menu definitions to the front‑end. Menus
 * are fetched from the database via the MenuService and returned as
 * JSON. The optional userId query parameter determines for which user
 * the menu authorization should be resolved.
 */
@RestController
@RequestMapping("/api/webcom")
@CrossOrigin
public class MainController {
	@Autowired
    private MainService mainService;


    /**
     * Retrieve the full menu structure for a given user. If no userId
     * parameter is provided, a default user ("KICHO") is used.
     *
     * @param usrId optional user identifier
     * @return list of menu entities
     */
//    @GetMapping
//    public List<MainEntity> getMenus(@RequestParam(name = "getmenus", required = false, defaultValue = "KICHO") String userId) {
//        return menuService.getMenus(userId);
//    }

    @PostMapping("/getmain")
    public List<Map<String, Object>> getMain(@RequestBody Map<String, Object> param)
    {
        return mainService.getMain(param);
    }
}