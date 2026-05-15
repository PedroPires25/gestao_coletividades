# ⚠️ INSTRUÇÕES DE LIMPEZA - Antes de Compilar

Foram criados ficheiros duplicados durante o desenvolvimento. **Precisas de removê-los antes de compilar o projeto**.

## Ficheiros a Remover

Localização: `gestao-clubes-api\src\main\java\com\gestaoclubes\api\dao\`

❌ **REMOVE ESTES 2 FICHEIROS:**
1. `ColetividadeAtividadeDAO_NEW.java`
2. `ColetividadeAtividadeDAO.java.backup`

✅ **MANTÉM ESTE:**
- `ColetividadeAtividadeDAO.java` (o ficheiro correto, com o novo método `buscarAtivaPorColetividadeEAtividade()`)

## Como Remover

### Opção 1: Via Explorer (Mais Fácil)
1. Abrir: `C:\Users\Pedro Pires\Desktop\Projeto-final\gestao-clubes-api\src\main\java\com\gestaoclubes\api\dao\`
2. Procurar por ficheiros com nome `ColetividadeAtividade*`
3. Eliminar:
   - ❌ `ColetividadeAtividadeDAO_NEW.java`
   - ❌ `ColetividadeAtividadeDAO.java.backup`
4. Deixar apenas `ColetividadeAtividadeDAO.java`

### Opção 2: Via Script (Se tiveres PowerShell)
```powershell
cd "C:\Users\Pedro Pires\Desktop\Projeto-final\gestao-clubes-api\src\main\java\com\gestaoclubes\api\dao"
Remove-Item "ColetividadeAtividadeDAO_NEW.java"
Remove-Item "ColetividadeAtividadeDAO.java.backup"
```

### Opção 3: Via Batch Script
```batch
cd "C:\Users\Pedro Pires\Desktop\Projeto-final"
cleanup.bat
```

## Após Limpeza

1. Limpar cache Maven (opcional):
   ```bash
   mvn clean
   ```

2. Compilar:
   ```bash
   mvn clean compile
   ```

3. Se tudo correr bem, deverias ver:
   ```
   [INFO] BUILD SUCCESS
   ```

## Ficheiros Modificados Corretos

Estes ficheiros foram modificados corretamente e NÃO precisam de limpeza:
- ✅ `ColetividadeAtividadeDAO.java` - tem o novo método
- ✅ `RedirectService.java` - usa o novo DAO
- ✅ `AuthRestController.java` - usa RedirectService
- ✅ `AuthContext.jsx` - armazena redirectUrl
- ✅ `LoginPage.jsx` - usa redirectUrl
- ✅ `App.jsx` - rotas corretas

