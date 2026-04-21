package com.minibytes.notes.exception;

public class TaskAccessDeniedException extends RuntimeException {

    public TaskAccessDeniedException(String message) {
        super(message);
    }
}
