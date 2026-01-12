package com.godisweb.controller.admin;

import java.util.List;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.admin.RoleService;

/**
 * @author 김은지
 * @since  2025. 10. 23
 *         <PRE>
 *         역할 정의
 *         2025. 10. 23. kej : 최조작성
 *         </PRE>
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin
@Slf4j
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

	/**
	 * @author     김은지
	 * @since      2025. 10. 23
	 * @MethodName getRoles
	 * @return     List<Map<String, Object>>
	 *             Role 및 메뉴/버튼 권한을 조회한다.
	 */
    @PostMapping("/getroles")
    public List<Map<String, Object>> getRoles(@RequestBody Map<String, Object> param)
    {
        return roleService.getRoles(param);
    }
    
	/**
	 * @author     김은지
	 * @since      2025. 10. 23
	 * @MethodName getMenuButnAuth
	 * @return     List<Map<String, Object>>
	 *             메뉴/버튼 권한을 조회한다.
	 */
    @PostMapping("/getMenuButnAuth")
    public Map<String, Object> getMenuButnAuth(@RequestBody Map<String, Object> param)
    {
        return roleService.getMenuButnAuth(param);
    }

    /**
     * @author 신상민
     * @since 2025. 12. 03
     * @MethodName saverolemenu
     * @return void
     * @Description 메뉴/버튼 권한을 저장한다.
     */
    @PostMapping(value = "/saveRoleMenu")
    public void saveRoleMenu(@RequestBody Map<String, Object> param) {
        roleService.saveRoleMenu(param);

    }

    /**
     * @author 신상민
     * @since 2025. 12. 04
     * @MethodName saverole
     * @return void
     * @Description 역할저장
     */
    @PostMapping(value = "/saveRole", consumes = MediaType.APPLICATION_JSON_VALUE)
    public int saveRole(@RequestBody Map<String, Object> param) {
        roleService.saveRole(param);
        return 1;
    }
}