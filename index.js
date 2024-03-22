const express = require('express');
const mysql = require('mysql2');
const exphbs = require('express-handlebars').create({ defaultLayout: 'main' });
const path = require('path');
const bcrypt = require('bcrypt');


//importar modulo fileupload
const fileupload = require('express-fileupload');

// Inicializando o aplicativo Express
const app = express();
// Configurando o middleware express-fileupload
app.use(fileupload());

// Configuração do Handlebars
app.engine('handlebars', exphbs.engine);
app.set('view engine', 'handlebars');

// Adicionar o estilo.css
app.use('/public', express.static('./css'));

// Referenciar a pasta imagens
app.use('/img', express.static('./img'));

// Middleware para analisar dados do corpo da solicitação
app.use(express.urlencoded({ extended: true }));

// Middleware para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da conexão com o MySQL
const connection = mysql.createConnection({
    host: 'localhost', // Seu host do MySQL
    user: 'root', // Seu usuário do MySQL
    password: 'root123', // Sua senha do MySQL
    database: 'bd_padaria' // Nome do seu banco de dados
});

// Estabelecer a conexão
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conexão com o banco de dados MySQL estabelecida com sucesso!');
});

// Rota para a página inicial
app.get('/', (req, res) => {
    res.render('index', { title: 'Página inicial' });
});

// Rota para a página de produtos
app.get('/produto', (req, res) => {
    res.render('produto', { title: 'Página de Produtos' });
});

// Rota para a página de login
app.get('/login', (req, res) => {
    res.render('tela_login', { title: 'Página de Login' });
});

// Rota para a página do usuario
app.get('/usuario', (req, res) => {
    res.render('tela_usuario', { title: 'Página do Usuário' });
});

// Rota para processar o cadastro de usuário
app.post('/cadastro', (req, res) => {
    const { emailCadastro, senhaCadastro } = req.body;

    // Validar entrada do usuário
    if (!emailCadastro || !senhaCadastro) {
        return res.status(400).send('E-mail e senha são obrigatórios.');
    }

    // Hash da senha antes de armazenar no banco de dados
    bcrypt.hash(senhaCadastro, 10, (err, hash) => {
        if (err) {
            console.error('Erro ao gerar hash da senha:', err);
            return res.status(500).send('Erro ao cadastrar o usuário');
        }

        // Inserir os dados na tabela do MySQL
        connection.query('INSERT INTO usuario (email, senha) VALUES (?, ?)', [emailCadastro, hash], (err, result) => {
            if (err) {
                console.error('Erro ao inserir dados na tabela:', err);
                return res.status(500).send('Erro ao cadastrar o usuário');
            }
            console.log('Usuário cadastrado com sucesso:', result);
            res.redirect('/login');
        });
    });
});




// Rota para inserir o endereço
app.post('/endereco', (req, res) => {
    const { cep, endereco, numero, complemento, bairro, cidade, estado } = req.body;
    const usuario_id = req.user.id; // Supondo que o ID do usuário esteja disponível na propriedade 'user'

    // Inserir os dados do endereço na tabela de endereço
    connection.query('INSERT INTO endereco (usuario_id, cep, endereco, numero, complemento, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [usuario_id, cep, endereco, numero, complemento, bairro, cidade, estado],
        (err, resultEndereco) => {
            if (err) {
                console.error('Erro ao inserir dados na tabela de endereço:', err);
                res.status(500).send('Erro ao inserir dados na tabela de endereço');
                return;
            }

            console.log('Dados inseridos com sucesso na tabela de endereço:', resultEndereco);
            res.redirect('/endereco');
        });
});

app.post('/login', (req, res) => {
    const { emailLogin, senhaLogin } = req.body;

    // Validar entrada do usuário
    if (!emailLogin || !senhaLogin) {
        return res.status(400).send('E-mail e senha são obrigatórios.');
    }

    // Consultar o banco de dados para verificar as credenciais do usuário
    connection.query('SELECT * FROM usuario WHERE email = ?', [emailLogin], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).send('Erro ao consultar o banco de dados');
        }

        // Verificar se o usuário foi encontrado
        if (results.length === 0) {
            return res.status(401).send('Usuário não encontrado');
        }

        const usuario = results[0];

        // Comparar a senha fornecida com a senha armazenada no banco de dados
        bcrypt.compare(senhaLogin, usuario.senha, (err, result) => {
            if (err) {
                console.error('Erro ao comparar as senhas:', err);
                return res.status(500).send('Erro ao verificar as credenciais');
            }

            if (result) {
                // Redirecionar com base no tipo de usuário
                if (usuario.tipo_usuario === 'comum') {
                    return res.redirect('/usuario');
                } else if (usuario.tipo_usuario === 'super') {
                    return res.redirect('/adm');
                } else {
                    return res.status(401).send('Tipo de usuário desconhecido');
                }
            } else {
                return res.status(401).send('Credenciais inválidas');
            }
        });
    });
});

// Rota para a página listar produtos
app.get('/listaProduto', (req, res) => {
    // Consulta SQL para selecionar todos os produtos da tabela
    const query = 'SELECT id, nome, preco, quantidade, categoria, fornecedor FROM produtos';

    // Executa a consulta SQL
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro ao buscar os produtos');
            return;
        }

        // Renderiza a página HTML com os produtos
        res.render('listar_produtos', { title: 'Listagem de Produtos', produtos: results });
    });
});



// Rota para a página editar usuario
app.get('/editar', (req, res) => {
    res.render('tela_edit_conta', { title: 'Página Editar Usuario' });
});

// Rota para a página editar endereço
app.get('/endereco', (req, res) => {
    res.render('tela_endereco', { title: 'Página Editar Endereço' });
});

// Rota para a página lista de pedidos
app.get('/pedidos', (req, res) => {
    res.render('tela_pedidos', { title: 'Página Lista de Pedidos' });
});

// Rota para a página sobre a empresa
app.get('/sobre', (req, res) => {
    res.render('sobre', { title: 'Página Sobre' });
});

// Rota para a página ADM
app.get('/cardapio', (req, res) => {
    res.render('cardapio', { title: 'Página Cardapio' });
});

// Rota para a página contatos
app.get('/contato', (req, res) => {
    res.render('tela_contato', { title: 'Página contato' });
});

// Rota para a página ADM
app.get('/adm', (req, res) => {
    res.render('tela_adm', { title: 'Página Administrador' });
});

// Rota para a página adicionar produto
app.get('/add_produto', (req, res) => {
    res.render('tela_add_produto', { title: 'Página Add Produto' });
});

// Rota para a página listar produto
app.get('/listaProduto', (req, res) => {
    res.render('listar_produto', { title: 'Página Listar Produto' });
});

// Rota para a página Atualizar produto
app.get('/Atualizar', (req, res) => {
    res.render('tela_atualizar', { title: 'Página Atualizar' });
});


// Rota para renderizar o formulário HTML
app.get('/formulario', (req, res) => {
    res.sendFile(path.join(__dirname, 'formulario.html'));
});

// Rota para receber e processar os dados do formulário com upload de arquivo
app.post('/formulario', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }

    const { nome, preco, quantidade, categoria, fornecedor } = req.body;
    const imagem = req.files.add; // Alterado de req.files.imagem para req.files.add

    // Use the mv() method to place the file somewhere on your server
    imagem.mv('../img' + imagem.name, (err) => {
        if (err) {
            console.error('Erro ao mover o arquivo:', err);
            return res.status(500).send('Erro ao mover o arquivo.');
        }

        // Inserir os dados na tabela de produtos
        connection.query(
            'INSERT INTO produtos (nome, imagem, preco, quantidade, categoria, fornecedor) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, imagem.name, preco, quantidade, categoria, fornecedor],
            (err, result) => {
                if (err) {
                    console.error('Erro ao inserir dados na tabela de produtos:', err);
                    res.status(500).send('Erro ao inserir dados na tabela de produtos');
                    return;
                }
                console.log('Dados inseridos com sucesso na tabela de produtos:', result);
                res.redirect('/add_produto');
            }
        );
    });
});


/*
// Suponha que o e-mail e a senha do super usuário sejam conhecidos
const emailSuperUsuario = 'admin@admin.com';
const senhaSuperUsuario = 'admin'; // A senha em texto simples

// Número de saltos para a função de hash bcrypt
const saltRounds = 10;

// Função para criptografar a senha usando bcrypt
bcrypt.hash(senhaSuperUsuario, saltRounds, (err, hash) => {
    if (err) {
        console.error('Erro ao criptografar a senha:', err);
        return;
    }

    // Inserir os dados do super usuário na tabela de usuários do banco de dados
    connection.query('INSERT INTO usuario (email, senha, tipo_usuario) VALUES (?, ?, ?)', [emailSuperUsuario, hash, 'super'], (err, result) => {
        if (err) {
            console.error('Erro ao inserir dados do super usuário no banco de dados:', err);
            return;
        }
        console.log('Super usuário cadastrado com sucesso:', result);
    });
});

*/

// Inicializando o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

