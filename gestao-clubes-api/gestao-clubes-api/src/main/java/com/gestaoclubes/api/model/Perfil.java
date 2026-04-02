package com.gestaoclubes.api.model;

/**
 * Classe Perfil representa o tipo ou função de um utilizador no sistema.
 * Ex: "Administrador", "Técnico", "Formador", etc.
 */
public class Perfil {

    // Identificador único do perfil (chave primária na base de dados)
    private final int id;

    // Descrição textual do perfil (ex: "Administrador")
    private final String descricao;

    // Construtor completo que recebe os dois atributos
    public Perfil(int id, String descricao) {
        this.id = id;
        this.descricao = descricao;
    }

    // Getter para o ID do perfil
    public int getId() {
        return id;
    }

    // Getter para a descrição do perfil
    public String getDescricao() {
        return descricao;
    }

    // Representação textual do objeto (exibida em JComboBox, tabelas, etc.)
    @Override
    public String toString() {
        return descricao;
    }
}
