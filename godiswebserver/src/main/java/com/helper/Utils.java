package com.helper;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
public class Utils {
    private static final ObjectMapper mapper = new ObjectMapper();
    public static <T> List<T> toList(Object node, Class<T> type) {
        return mapper.convertValue(
                node,
                mapper.getTypeFactory().constructCollectionType(List.class, type)
        );
    }
}
