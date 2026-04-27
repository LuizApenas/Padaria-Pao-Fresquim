// apps/api/src/controllers/clienteController.js
import { clienteService } from "../services/clienteService.js";

// O Express 5 envia promises rejeitadas para o middleware global de erros.
// Assim cada controller fica focado apenas nos detalhes de request e response.
export const clienteController = {
  // GET /clientes
  async index(_request, response) {
    const clientes = await clienteService.listClientes();

    return response.status(200).json(clientes);
  },

  // GET /clientes/:id
  async show(request, response) {
    const cliente = await clienteService.getClienteById(request.params.id);

    return response.status(200).json(cliente);
  },

  // POST /clientes
  async store(request, response) {
    const cliente = await clienteService.createCliente(request.body);

    return response.status(201).json(cliente);
  },

  // PUT /clientes/:id
  async update(request, response) {
    const cliente = await clienteService.updateCliente(request.params.id, request.body);

    return response.status(200).json(cliente);
  },

  // DELETE /clientes/:id
  async destroy(request, response) {
    await clienteService.deleteCliente(request.params.id);

    return response.status(204).send();
  },
};
